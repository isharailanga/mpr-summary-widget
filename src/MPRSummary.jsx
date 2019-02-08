/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

import axios from 'axios';
import FilledInput from '@material-ui/core/FilledInput';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
// import Select from 'react-select';
import Select from '@material-ui/core/Select';
import { styled } from '@material-ui/styles';
import { FormattedMessage } from 'react-intl';
import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core/styles';
import { url as _url } from './config.json';

const hostUrl = _url;
const styledBy = (property, mapping) => props => mapping[props[property]];

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark'
    },
    typography: {
        fontFamily: [
            "Roboto",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Arial",
            "sans-serif"
        ].join(","),
        useNextVariants: true
    }
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light'
    },
    typography: {
        fontFamily: [
            "Roboto",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Arial",
            "sans-serif"
        ].join(","),
        useNextVariants: true
    }
});

const PageWrapper = withStyles({
    root: {
        padding: '30px',
        background: 'transparent',
        boxShadow: 'none'
    }
})(Paper);

const CustomTableHeaderCell = styled(({ color, ...others }) => <TableCell {...others} />)({
    background: styledBy('color', {
    //   light: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    //   dark: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
    light: '#D1CFCF',
    dark: '#6B6B6B'
    })
});

const styles = {
    h4: {
        marginBottom: '20px'
    },
    table: {
        tableHead: {
            tableCell: {
                fontSize: '18px',
                fontWeight: 500,
                paddingTop: '10px',
                paddingBottom: '10px'
            }
        },
        tableBody: {
            tableCell: {
                fontSize: '16px'
            }
        }
    },
    formControl: {
        margin: '0 20px 30px 0',
        minWidth: 120,
    },
};

class MPRSummary extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            order: 'desc',
            orderBy: '',
            tableColumnNames: ['Doc Status', 'Count'],
            sortColumns: this.props.sortColumns,
            rows: [['Not Started', 0], ['Draft Received', 0], ['No Draft', 0], ['In-progress', 0], ['Issues Pending', 0]],
            page: 0,
            noDataMessage: this.props.noDataMessage ||
                <FormattedMessage id='table.no.results.available' defaultMessage='No results available' />,
            requirePagination: this.props.requirePagination || false,
            selectedOption: null,
            selectedProduct: '',
            selectedVersion: '',
            products: [],
            versions: []

        };

        this.props.glContainer.on('resize', () => {
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            });
        }
        );

        this.handleChangeVersion = this.handleChangeVersion.bind(this);
        this.handleChangeProduct = this.handleChangeProduct.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadPRTable = this.loadPRTable.bind(this);
        this.clearTable = this.clearTable.bind(this);
        this.clearVersion = this.clearVersion.bind(this);
    }

    //changing version selector
    handleChangeVersion(event) {
        let selectedVersion = event.target.value;
        console.log(selectedVersion);
        this.setState({ selectedVersion });
        this.clearTable();
        //populate table based on (each product's) selected version
        this.loadPRTable(this.state.selectedProduct, selectedVersion);
    }

    clearTable() {
        // clear table
        let rows = [['Not Started', 0], ['Draft Received', 0], ['No Draft', 0], ['In-progress', 0], ['Issues Pending', 0]];
        this.setState({ rows });
    }

    clearVersion() {
        //reset the version selector and load versions based on product
        let selectedVersion = null;
        this.setState({ selectedVersion });
    }

    //changing product selector
    handleChangeProduct(event) {
        let selectedProduct = event.target.value;
        console.log(selectedProduct);
        //this.setState({ selectedProduct });
        this.setState({ selectedProduct: event.target.value })
        this.clearVersion();
        this.clearTable();
        this.loadVersions(selectedProduct);
    }

    loadVersions(selectedProduct) {
        //get version based on product name
        const getVersions = hostUrl + '/versions?product=' + selectedProduct;
        axios.get(getVersions)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    let versionArray = Object.values(response.data.data);
                    this.setState({
                        versions: versionArray
                    });
                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    loadPRTable(productName, prodVersion) {
        // retrieve mpr count based on product
        let url = hostUrl + '/prcount?product=' + productName + '&version=' + prodVersion;
        axios.get(url)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    let newRows = this.state.rows.slice(0);
                    response.data.data.forEach(record => {
                        let status;
                        switch (record.docStatus) {
                            case 0:
                                status = 'Not Started';
                                break;
                            case 1:
                                status = 'Draft Received';
                                break;
                            case 2:
                                status = 'No Draft';
                                break;
                            case 3:
                                status = 'In-progress';
                                break;
                            case 4:
                                status = 'Issues Pending';
                                break;
                            default:
                                status = 'Invalid Status';
                                break;
                        }
                        for (var i = 0; i < newRows.length; i++) {
                            if (newRows[i][0] == status) {
                                newRows[i][1] = record.count;
                            }
                        }
                    })
                    this.setState({ rows: newRows });

                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });

    }

    loadProducts() {

        // Load product names when the page is loading
        const getProductsUrl = hostUrl + '/products';
        axios.get(getProductsUrl)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    let productArray = Object.values(response.data.data);
                    this.setState({
                        products: productArray
                    });
                } else {
                    console.log("No data in products.");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    componentDidMount() {

        this.loadProducts();

        // retrieve totl mpr count based on product
        let url2 = 'http://localhost:9090/totalprcount?product=Analytics&version=4.1.0';

        axios.get(url2)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    console.log("count:", response.data.data.count)
                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });



    }

    /**
        * render custom table
        * */
    render() {
        const { rows, products, versions } = this.state;

        return (
            <MuiThemeProvider
                theme={this.props.muiTheme.name === 'dark' ? darkTheme : lightTheme}>
                <PageWrapper>

                    {/* product selector */}

                    <Typography variant='h4' style={styles.h4}>DOC status of MPRs</Typography>

                    <FormControl style={styles.formControl}>
                        <InputLabel htmlFor='product-select'>Product:</InputLabel>
                        <Select
                            value={this.state.selectedProduct}
                            onChange={this.handleChangeProduct}
                            inputProps={{
                                name: 'product',
                                id: 'product-select'
                            }}
                        >
                            <MenuItem value=""> <em>None</em> </MenuItem>
                            {products.map((data) => {
                                return (
                                    <MenuItem value={data}>{data}</MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>


                    {/* version selector */}

                    <FormControl style={styles.formControl}>
                        <InputLabel htmlFor='version-select'>Version:</InputLabel>
                        <Select
                            value={this.state.selectedVersion}
                            onChange={this.handleChangeVersion}
                            inputProps={{
                                name: 'version',
                                id: 'version-select'
                            }}
                        >
                            {/* <MenuItem value=""> <em>None</em> </MenuItem> */}
                            {versions.map((data) => {
                                return (
                                    <MenuItem value={data}>{data}</MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>




                    {/* MPR table */}
                    <Paper>
                        <div>
                            <Table style={styles.table}>
                                <TableHead>
                                    <TableRow>
                                        <CustomTableHeaderCell color={this.props.muiTheme.name} style={styles.table.tableHead.tableCell}> Doc Status </CustomTableHeaderCell>
                                        <CustomTableHeaderCell color={this.props.muiTheme.name} style={styles.table.tableHead.tableCell}> MPR count </CustomTableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map(row => {
                                        return (
                                            <TableRow>
                                                {row.map((data) => {
                                                    return (
                                                        <TableCell style={styles.table.tableBody.tableCell}> {data} </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </Paper>
                </PageWrapper>
            </MuiThemeProvider>
        );
    }
}

global.dashboard.registerWidget('MPRSummary', MPRSummary);